#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=arancino-rpi-scripts
PKG_VERSION:=1.0
PKG_RELEASE:=7

include $(INCLUDE_DIR)/package.mk

define Package/arancino-rpi-scripts
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE:=Custom Arancino RPi support package
  DEFAULT:=y
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
	$(INSTALL_DIR) $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/osjs
	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/etc/init.d
	#$(INSTALL_DIR) $(1)/etc/smartme

	# /etc
	$(INSTALL_DATA) ./files/etc/rc.local $(1)/etc

	# /etc/config DIR
	$(INSTALL_CONF) ./files/etc/config/wireless $(1)/etc/config/wireless
	$(INSTALL_CONF) ./files/etc/config/smartme $(1)/etc/config

	# /usr/bin
	$(INSTALL_BIN) ./files/usr/bin/smartme-wifi-connect $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-live-or-reset $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-reload $(1)/usr/bin
	$(INSTALL_BIN) ./files/usr/bin/wifi-reset-and-reboot $(1)/usr/bin

	# /etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/rename-wifi-if-access-point $(1)/etc/init.d
	#$(INSTALL_BIN) ./files/etc/init.d/generate_new_gpg_key $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/handle_wifi_reset $(1)/etc/init.d

	$(CP) ./files/etc/uci-defaults/* $(1)/etc/uci-defaults
	$(CP) ./files/osjs/* $(1)/osjs
	$(CP) ./files/usr/lib/* $(1)/usr/lib
endef

define Package/arancino-rpi-scripts/postinst
#!/bin/sh
if [ -e /etc/config/uhttpd ]
then
	# make the webserver ponting to /osjs instead of /www
	sed -i -e 's/www/osjs\/dist/g' /etc/config/uhttpd

	# Linking LUci
	mkdir -p /osjs/dist/luci
	ln -sf /www/index.html /osjs/dist/luci/index.html
	ln -sf /www/luci-static /osjs/dist/luci-static
	ln -sf /www/cgi-bin/luci /osjs/dist/cgi-bin/luci
fi
if [ -e /etc/shadow ]
then
	# set the new default password
	sed -i 's|^root::|root:$1$VmdTXWeP$c6u7hCp8MmragUglVncTI/:|' /etc/shadow
fi
exit 0
endef

$(eval $(call BuildPackage,arancino-rpi-scripts))
