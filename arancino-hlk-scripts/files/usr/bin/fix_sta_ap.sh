#!/bin/sh
#
# Fix loss of AP when STA (Client) mode fails by reverting to default
# AP only configuration. Default AP configuration is assumed to be in
# /etc/config/wireless.ap-only
#
 
 
TIMEOUT=30
SLEEP=3
 
sta_err=0
 
while [ $(iwinfo | grep -c "ESSID: unknown") -ge 1 ]; do
   let sta_err=$sta_err+1
   if [ $((sta_err * SLEEP)) -ge $TIMEOUT ]; then
     cp /etc/config/wireless.ap-only /etc/config/wireless
     wifi up
#    uncomment the following lines to try AP+STA after reboot
     sleep 3
     cp /etc/config/wireless.ap+sta /etc/config/wireless
     break
   fi
 
   sleep $SLEEP
 
done
