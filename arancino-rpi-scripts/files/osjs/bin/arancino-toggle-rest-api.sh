#!/bin/sh
#
# A simple script for setting REST api
#
# Arguments: <value>
#

if [ ! -n "$1" ]; then
  #/sbin/uci get arancino.@arancino[0].secure_rest_api
  exit 0
fi

#/sbin/uci set arancino.@arancino[0].secure_rest_api=$1
#/sbin/uci commit arancino
echo "true"
