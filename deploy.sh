docker build -t ferret .

docker build -t ferret_model ./src/ferret/ferret

docker run -p 8080:80 ferret