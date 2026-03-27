#!/usr/bin/env bash
set -euo pipefail

listen_host="0.0.0.0"
listen_port=""
target_host="127.0.0.1"
target_port=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --listen-host)
      listen_host="$2"
      shift 2
      ;;
    --listen-port)
      listen_port="$2"
      shift 2
      ;;
    --target-host)
      target_host="$2"
      shift 2
      ;;
    --target-port)
      target_port="$2"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

if [[ -z "$listen_port" || -z "$target_port" ]]; then
  echo "Usage: $0 --listen-port <port> --target-port <port> [--listen-host <host>] [--target-host <host>]" >&2
  exit 1
fi

if ! command -v socat >/dev/null 2>&1; then
  echo "socat is required but not installed" >&2
  exit 1
fi

echo "Forwarding ${listen_host}:${listen_port} -> ${target_host}:${target_port}"
exec socat "TCP-LISTEN:${listen_port},bind=${listen_host},reuseaddr,fork" "TCP:${target_host}:${target_port}"