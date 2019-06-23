FROM php:7.2-apache

ENV APACHE_DOCUMENT_ROOT /app
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

COPY ./index.php /app/index.php
COPY ./src/ /app/vs/

RUN chmod -R 777 /app

WORKDIR /app
