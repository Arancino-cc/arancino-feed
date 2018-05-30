#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=arancino-rpi-scripts
PKG_VERSION:=1.0
PKG_RELEASE:=17

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
	$(INSTALL_DIR) $(1)/etc/hotplug.d/usb
	#$(INSTALL_DIR) $(1)/etc/smartme

	# /etc
	#$(INSTALL_BIN) ./files/etc/rc.local $(1)/etc

	# /etc/config DIR
	$(INSTALL_CONF) ./files/etc/config/wireless $(1)/etc/config/wireless
	$(INSTALL_CONF) ./files/etc/config/smartme $(1)/etc/config

	# /usr/bin
	$(INSTALL_BIN) ./files/usr/bin/smartme-wifi-connect $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-live-or-reset $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-reload $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-reset-and-reboot $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/installer $(1)/usr/bin

	# /etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/rename-wifi-if-access-point $(1)/etc/init.d
	#$(INSTALL_BIN) ./files/etc/init.d/generate_new_gpg_key $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/handle_wifi_reset $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/can-setup $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/node-red $(1)/etc/init.d

	# /etc/init.d
	$(INSTALL_BIN) ./files/etc/hotplug.d/usb/21-ftdi-usb $(1)/etc/hotplug.d/usb
	

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
	#@echo dtoverlay=spi0-cs,cs0_pin=8 >> $${IPKG_INSTROOT}/boot/config.txt
	#@echo dtoverlay=mcp2515-can0,interrupt=6 >> $${IPKG_INSTROOT}/boot/config.txt
	@echo dtoverlay=spi0-cs,cs1_pin=7 >> $${IPKG_INSTROOT}/boot/config.txt
	@echo dtoverlay=mcp2515-can0,interrupt=6 >> $${IPKG_INSTROOT}/boot/config.txt
fi
exit 0
endef

$(eval $(call BuildPackage,arancino-rpi-scripts))
