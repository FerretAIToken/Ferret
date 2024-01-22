FROM node:lts AS base

RUN apt-get update && \
    apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libsm6 \
    libxext6 \
    libxrender-dev

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
COPY . /app
WORKDIR /app
 
RUN pnpm install
 
CMD ["pnpm", "start"]