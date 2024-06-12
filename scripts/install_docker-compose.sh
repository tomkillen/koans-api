#!/usr/bin/env bash
set -e

# Pin which version of docker-compose to install
VERSION=v2.27.1

# Detect operating system (linux or darwin)
OS=$(uname -s|tr '[:upper:]' '[:lower:]')

# Map system architecture to available binary
case $(uname -m) in
arm64)
  ARCH=aarch64
  ;;
*)
  ARCH=x86_64
  ;;
esac

echo "Installing docker-compose $VERSION to ./bin"
echo "  OS    $OS"
echo "  Arch  $ARCH"
echo

# Ensure ./bin exists
mkdir -p bin/

# Download docker-compose
curl \
  --output bin/docker-compose \
  --location \
  --silent \
  https://github.com/docker/compose/releases/download/$VERSION/docker-compose-$OS-$ARCH

chmod +x bin/docker-compose

