#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=arancino-hlk-scripts
PKG_VERSION:=1.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/arancino-hlk-scripts
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=Custom Arancino HLK support package
  DEFAULT:=m
endef

define Package/arancino-hlk-scripts/conffiles
/etc/config/smartme
endef

define Build/Compile
	# NOOP
endef

define Package/arancino-hlk-scripts/install
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/etc/init.d
	#$(INSTALL_DIR) $(1)/etc/smartme

	# /etc
	#$(INSTALL_DATA) ./files/etc/rc.local $(1)/etc

	# /etc/config DIR
	$(INSTALL_CONF) ./files/etc/config/smartme $(1)/etc/config
	$(INSTALL_CONF) ./files/etc/config/wireless $(1)/etc/config

	# /usr/bin
	$(INSTALL_BIN) ./files/usr/bin/smartme-wifi-connect $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-live-or-reset $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-reload $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-reset-and-reboot $(1)/usr/bin

	# /etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/rename-wifi-if-access-point $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/handle_wifi_reset $(1)/etc/init.d

	$(CP) ./files/etc/uci-defaults/* $(1)/etc/uci-defaults
endef

define Package/arancino-hlk-scripts/postinst
#!/bin/sh
if [ -e $${IPKG_INSTROOT}/etc/config/wireless ]
then
	sed -i -e "s/LinkIt.*/SmartME\'/g" $${IPKG_INSTROOT}/etc/config/wireless
fi
if [ -e $${IPKG_INSTROOT}/etc/shadow ]
then
	# set the new default password
	sed -i 's|^root::|root:\$$1\$$VmdTXWeP\$$c6u7hCp8MmragUglVncTI\/:|' $${IPKG_INSTROOT}/etc/shadow
fi
#if [ -e $${IPKG_INSTROOT}/boot/config.txt ]
#then
#        # enable spi and configure can interface
#	@echo dtoverlay=spi0-cs,cs0_pin=8 >> $${IPKG_INSTROOT}/boot/config.txt
#	@echo dtoverlay=mcp2515-can0,interrupt=6 >> $${IPKG_INSTROOT}/boot/config.txt
#fi
exit 0
endef

$(eval $(call BuildPackage,arancino-hlk-scripts))
