FROM debian:9

RUN apt-get update -q && \
    DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    ca-certificates \
    openssh-server \
    wget \
    curl \
    apt-transport-https

RUN useradd -ms /bin/bash app
WORKDIR /home/app

# Angular
RUN curl -sL https://deb.nodesource.com/setup_10.x | bash -
RUN apt-get -y install nodejs
RUN yes n | npm install -g @angular/cli

# Rust
RUN DEBIAN_FRONTEND=noninteractive apt-get install -yq --no-install-recommends \
    curl \
    libpq-dev \
    python-dev \
    gcc \
    libssl-dev \
    pkg-config
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --default-toolchain nightly -y
RUN ~/.cargo/bin/cargo install diesel_cli --no-default-features --features postgres

# Compile backend
WORKDIR /home/app/rust-backend
RUN mkdir -p ./log
RUN mkdir -p ./certs
RUN echo "DATABASE_URL=postgres://open_data:0808ee1360fd717cb5a23961ddc3863f@database:5432/shop_db" >> .env
RUN echo "DATABASE_TIMEOUT=15" >> .env
RUN echo "LOG_DIR=./log" >> .env
RUN echo "CERT_DIR=./certs" >> .env
RUN echo "HTTP_PORT=8080" >> .env
RUN echo "HTTPS_PORT=8443" >> .env
COPY rust-backend/*.toml ./
COPY rust-backend/migrations ./migrations
COPY rust-backend/src ./src
RUN ~/.cargo/bin/cargo build

# Compile frontend
WORKDIR /home/app/angular-frontend
COPY angular-frontend/*.js .
COPY angular-frontend/*.json .
RUN yes n | npm i
COPY angular-frontend/src ./src
RUN ng build --prod --deploy-url /static/ --output-path dist/

# Ready to run
WORKDIR /home/app/rust-backend
CMD ~/.cargo/bin/cargo run -- --watchdog  \
    && sleep 5 \
    && ~/.cargo/bin/diesel migration run  \
    && ~/.cargo/bin/cargo run
