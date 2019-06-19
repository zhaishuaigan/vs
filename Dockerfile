FROM php:fpm-alpine
COPY ./src/ /app/

WORKDIR /app
RUN apk add --no-cache nginx \
    && mkdir /run/nginx \
    && chown -R www-data:www-data /app \
    && chmod -R 777 /app

COPY ./default.conf /etc/nginx/conf.d/default.conf
COPY ./php.ini /usr/local/etc/php/php.ini

EXPOSE 80
# Persistent config file and cache
VOLUME [ "/app"]

CMD php-fpm & \
    nginx -g "daemon off;"