package api

import (
	"maps"
	"net"
	"net/http"
	"net/netip"
	"strings"
	"sync"
	"time"
)

const (
	rateLimitRequests = 60
	rateLimitWindow   = time.Minute
	// Bounds memory. Hitting it starts a new window early, which only helps a client that already has this many addresses.
	rateLimitMaxClients = 100_000
)

// rateLimiter counts requests per client in a fixed window. The server runs as one process, so memory is enough.
type rateLimiter struct {
	limit     int
	window    time.Duration
	mu        sync.Mutex
	counts    map[string]int
	windowEnd time.Time
}

func newRateLimiter(limit int, window time.Duration) *rateLimiter {
	return &rateLimiter{limit: limit, window: window, counts: map[string]int{}}
}

func (l *rateLimiter) allow(client string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	if !now.Before(l.windowEnd) || len(l.counts) >= rateLimitMaxClients {
		clear(l.counts)
		l.windowEnd = now.Add(l.window)
	}
	l.counts[client]++
	return l.counts[client] <= l.limit
}

// keyLimiter counts requests per key, each in its own fixed window from the key's first request. For keys a client
// picks freely (from the URL), a full map evicts only expired windows and then refuses new keys: clearing every count
// as rateLimiter does would reset the attacked key's counter. Refusing new keys can lock everyone out for a window,
// which the spec accepts.
type keyLimiter struct {
	limit, max int
	window     time.Duration
	mu         sync.Mutex
	windows    map[string]keyWindow
}

type keyWindow struct {
	count int
	end   time.Time
}

func newKeyLimiter(limit int, window time.Duration) *keyLimiter {
	return &keyLimiter{limit: limit, max: rateLimitMaxClients, window: window, windows: map[string]keyWindow{}}
}

func (l *keyLimiter) allow(key string, now time.Time) bool {
	l.mu.Lock()
	defer l.mu.Unlock()
	expired := func(_ string, w keyWindow) bool { return !now.Before(w.end) }
	w, ok := l.windows[key]
	if !ok && len(l.windows) >= l.max {
		maps.DeleteFunc(l.windows, expired)
		if len(l.windows) >= l.max {
			return false
		}
	}
	if !ok || expired(key, w) {
		w = keyWindow{end: now.Add(l.window)}
	}
	w.count++
	l.windows[key] = w
	return w.count <= l.limit
}

// limitRate runs before App Check so forged tokens are limited too.
func limitRate(limiter *rateLimiter, next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !limiter.allow(clientKey(r), time.Now()) {
			writeError(w, http.StatusTooManyRequests, "too many requests")
			return
		}
		next(w, r)
	}
}

// clientKey is the real client address. Caddy is the only way in (compose.prod.yaml publishes no ports)
// and replaces X-Forwarded-For with the peer it saw, so a client can't fake it. Only the last entry is
// read because that's the one the proxy wrote. Without the header we were reached directly, as in local dev.
func clientKey(r *http.Request) string {
	forwarded := strings.Join(r.Header.Values("X-Forwarded-For"), ",")
	ip := strings.TrimSpace(forwarded[strings.LastIndex(forwarded, ",")+1:])
	if ip == "" {
		ip, _, _ = net.SplitHostPort(r.RemoteAddr)
	}
	addr, err := netip.ParseAddr(ip)
	if err != nil {
		return ip
	}
	addr = addr.Unmap()
	if addr.Is6() {
		// One IPv6 client typically controls a whole /64.
		prefix, _ := addr.Prefix(64)
		return prefix.String()
	}
	return addr.String()
}
