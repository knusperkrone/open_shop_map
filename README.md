# Open Shop Map

[See here!](https://devpost.com/software/16_lokale-unternehmen_openshopmap)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Dev-Rerequisites

What things you need to install the software and how to install them

- docker-ce
- angular-cli
- rustup
- diesel-cli

Shortcuts:

```bash
npm install -g @angular/cli
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install diesel_cli --no-default-features --features postgres
```

### Installing

To start the application run:

```bash
docker build -t open_shop_map .
sudo docker-compose up
```

then open your browser under ```localhost:8000```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details
