FROM php:fpm-alpine

RUN apk add --no-cache nginx && mkdir /run/nginx

COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY ./php.ini /usr/local/etc/php/php.ini
COPY ./index.php /app/index.php
COPY ./src/ /app/vs/

RUN chown -R www-data:www-data /app

WORKDIR /app

EXPOSE 80

CMD php-fpm & nginx -g "daemon off;"