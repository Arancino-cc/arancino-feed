#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=arancino-rpi-scripts
PKG_VERSION:=1.0
PKG_RELEASE:=6

include $(INCLUDE_DIR)/package.mk

define Package/arancino-rpi-scripts
  SECTION:=utils
  CATEGORY:=Base system
  TITLE:=Custom Arancino RPi support package
  DEPENDS:=@CONFIG_TARGET_brcm2708_bcm2710_DEVICE_rpi \
   +kmod-loop +wireless-tools +shellinabox \
   +kmod-usb-net +kmod-usb-net-rndis +kmod-usb-net-cdc-ether \
   +usbutils +udev +kmod-usb-net-asix +kmod-usb-net-asix-ax88179 +kmod-libphy \
   +uci-ssl-openssl +luci-app-openvpn +openvpn +libiwinfo +libiwinfo-lua +liblua \
   +libopenssl +libpam +librt +libubus-lua +libuci-lua +lua +lua-coxpcall +lua-wsapi-base \
   +lua-wsapi-xavante +lua-xavante +luafilesystem +luci +luci-app-firewall +luci-base \
   +luci-lib-ip +luci-lib-jsonc +luci-lib-nixio +luci-mod-admin-full +luci-proto-ipv6 \
   +luci-proto-ppp +luci-theme-bootstrap +openssl-util +rpcd +uhttpd +uhttpd-mod-ubus +zlib
  DEFAULT:=y
endef

define Package/arancino-rpi-scripts/conffiles
/etc/config/wireless
/etc/config/smartme
endef

# /etc/config/network
# /etc/config/firewall
# /etc/config/dhcp
# /etc/config/uhttpd


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
$(CP) $(1)/etc/config/firewall /etc/config/firewall.bak
$(CP) $(1)/etc/config/dhcp /etc/config/dhcp.bak
$(CP) $(1)/etc/config/uhttpd /etc/config/uhttpd.bak
$(CP) $(1)/etc/config/firewall.my /etc/config/firewall
$(CP) $(1)/etc/config/dhcp.my /etc/config/dhcp
$(CP) $(1)/etc/config/uhttpd.my /etc/config/uhttpd

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
exit 0
endef

$(eval $(call BuildPackage,arancino-rpi-scripts))
