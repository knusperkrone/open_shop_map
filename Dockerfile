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
    gcc
RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- --default-toolchain nightly -y
RUN ~/.cargo/bin/cargo install diesel_cli --no-default-features --features postgres

# Compile backend
WORKDIR /home/app/
RUN mkdir -p ./rust-backend/log
COPY rust-backend/*.toml ./rust-backend/
COPY rust-backend/migrations ./rust-backend/migrations
COPY rust-backend/src ./rust-backend/src
WORKDIR /home/app/rust-backend
RUN echo "BIND=0.0.0.0:8000" >> .env
RUN echo "DATABASE_URL=postgres://open_data:0808ee1360fd717cb5a23961ddc3863f@database:5432/shop_db" >> .env
RUN ~/.cargo/bin/cargo build

# Compile frontend
WORKDIR /home/app/
COPY angular-frontend/*.js ./angular-frontend/
COPY angular-frontend/*.json ./angular-frontend/
COPY angular-frontend/src ./angular-frontend/src
WORKDIR /home/app/angular-frontend
RUN yes n | npm i
RUN ng build --prod --deploy-url /static/ --output-path dist/

# Ready to run
WORKDIR /home/app/rust-backend
CMD ~/.cargo/bin/diesel migration run && \
    ~/.cargo/bin/cargo run --bin open_street_map_backend >> ./rust-backend/log/actix_log.txt
