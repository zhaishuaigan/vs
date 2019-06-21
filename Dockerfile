FROM php:fpm-alpine

RUN apk add --no-cache nginx \
    && mkdir /run/nginx \
    && mkdir /app \
    && chown -R www-data:www-data /app


COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY ./php.ini /usr/local/etc/php/php.ini
COPY ./index.php /app/
COPY ./src/ /app/vs/

WORKDIR /app

EXPOSE 80


CMD php-fpm & \
    nginx -g "daemon off;"