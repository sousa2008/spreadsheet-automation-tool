FROM php:8.2-apache

COPY web/ /var/www/html/

EXPOSE 80

CMD sed -i "s/80/${PORT:-80}/g" /etc/apache2/sites-available/000-default.conf /etc/apache2/ports.conf && apache2-foreground