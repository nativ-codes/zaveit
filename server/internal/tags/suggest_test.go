package tags

import (
	"reflect"
	"testing"
)

func TestParse(t *testing.T) {
	cases := map[string][]string{
		"Art, MUSIC , food": {"art", "music", "food"},
		"art,art,,  ,music": {"art", "music"},
		"a,b,c,d":           {"a", "b", "c"},
		"":                  {},
	}
	for input, want := range cases {
		if got := parse(input); !reflect.DeepEqual(got, want) {
			t.Errorf("parse(%q) = %v, want %v", input, got, want)
		}
	}
}
