FROM golang:1.27-alpine AS build
WORKDIR /src
COPY go.mod main.go ./
COPY internal ./internal
RUN CGO_ENABLED=0 go build -ldflags="-s -w" -o /server .

FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /server /server
EXPOSE 8080
ENTRYPOINT ["/server"]
