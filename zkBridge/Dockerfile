# Dockerfile for Helios installation

# base image with glibc 2.38 for helios compatibility
FROM debian:trixie-slim

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    curl \
    bash \
    libc6 \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Download and install Helios's installer
RUN curl https://raw.githubusercontent.com/a16z/helios/master/heliosup/install | bash

ENV PATH="/root/.helios/bin:$PATH"

RUN /root/.helios/bin/heliosup

# Set default command to start a shell
CMD ["/bin/bash"]