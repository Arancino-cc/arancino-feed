#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=arancino-rpi-scripts
PKG_VERSION:=1.0
PKG_RELEASE:=33

include $(INCLUDE_DIR)/package.mk

define Package/arancino-rpi-scripts
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=Custom Arancino RPi support package
  DEFAULT:=m
endef

define Package/arancino-rpi-scripts/conffiles
/etc/config/wireless
/etc/config/smartme
endef

define Build/Compile
	# NOOP
endef


define Package/arancino-rpi-scripts/install
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/etc/init.d
	#$(INSTALL_DIR) $(1)/etc/init-cfg
	$(INSTALL_DIR) $(1)/etc/hotplug.d/usb
	$(INSTALL_DIR) $(1)/etc/hotplug.d/ntp
	$(INSTALL_DIR) $(1)/etc/opkg
	$(INSTALL_DIR) $(1)/etc/monit.d
	#$(INSTALL_DIR) $(1)/etc/smartme

	# /etc
	$(INSTALL_BIN) ./files/etc/rc.local $(1)/etc

	# /etc/config DIR
	$(INSTALL_CONF) ./files/etc/config/wireless $(1)/etc/config/wireless
	$(INSTALL_CONF) ./files/etc/config/smartme $(1)/etc/config
	$(CP) ./files/etc/monit.d/* $(1)/etc/monit.d

	#$(INSTALL_DATA) ./files/etc/opkg/customfeeds.conf $(1)/etc/opkg/customfeeds.conf

	# /usr/bin
	$(INSTALL_BIN) ./files/usr/bin/smartme-wifi-connect $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-live-or-reset $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-reload $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-reset-and-reboot $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/installer $(1)/usr/bin

	# /etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/rename-wifi-if-access-point $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/ttyMAX $(1)/etc/init.d

	# /etc/init-cfg
	#$(INSTALL_BIN) ./files/etc/init-cfg/lightning-rod $(1)/etc/init-cfg
	#$(INSTALL_BIN) ./files/etc/init-cfg/node-red $(1)/etc/init-cfg

	# /etc/init.d
	$(INSTALL_BIN) ./files/etc/hotplug.d/usb/21-ftdi-usb $(1)/etc/hotplug.d/usb
	$(INSTALL_BIN) ./files/etc/hotplug.d/ntp/30-update-clock $(1)/etc/hotplug.d/ntp
	

	$(CP) ./files/etc/uci-defaults/* $(1)/etc/uci-defaults
endef

define Package/arancino-rpi-scripts/postinst
#!/bin/sh
if [ -e $${IPKG_INSTROOT}/etc/shadow ]
then
	# set the new default password
	sed -i 's|^root::|root:\$$1\$$VmdTXWeP\$$c6u7hCp8MmragUglVncTI\/:|' $${IPKG_INSTROOT}/etc/shadow
fi
if [ -e $${IPKG_INSTROOT}/boot/config.txt ]
then
    # enable spi and configure can interface
	echo dtoverlay=spi0-cs,cs0_pin=7 >> $${IPKG_INSTROOT}/boot/config.txt
	echo dtoverlay=scs-max3107-spi0 >> $${IPKG_INSTROOT}/boot/config.txt
fi 

#mkdir -p $${IPKG_INSTROOT}/etc/crontabs
#if ! grep -q hwclock $${IPKG_INSTROOT}/etc/crontabs/root; then echo $$'\n'"* */1 * * * hwclock -w" >>$${IPKG_INSTROOT}/etc/crontabs/root; fi

if ! grep -q procps-ng-ps $${IPKG_INSTROOT}/etc/profile; then echo "alias ps='procps-ng-ps'" >>$${IPKG_INSTROOT}/etc/profile; fi
if ! grep -q procps-ng-top $${IPKG_INSTROOT}/etc/profile; then echo "alias top='procps-ng-top'" >>$${IPKG_INSTROOT}/etc/profile; fi

exit 0
endef

$(eval $(call BuildPackage,arancino-rpi-scripts))
