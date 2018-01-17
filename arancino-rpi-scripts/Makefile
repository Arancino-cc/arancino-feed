#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=arancino-rpi-scripts
PKG_VERSION:=1.0
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk

define Package/arancino-rpi-scripts
  SECTION:=utils
  CATEGORY:=Base system
  TITLE:=Custom Arancino RPi scripts
  DEPENDS:=+kmod-loop
endef

define Package/arancino-rpi-scripts/conffiles
/etc/config/firewall
/etc/config/dhcp
/etc/config/network
/etc/config/wireless
endef

define Build/Compile
	# NOOP
endef

define Package/arancino-rpi-scripts/install
	$(INSTALL_DIR) $(1)/usr/bin/
	$(INSTALL_DIR) $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/osjs
	$(INSTALL_DIR) $(1)/etc/init.d

	# /etc/config DIR
	$(INSTALL_CONF) ./files/etc/config/firewall $(1)/etc/config/
	$(INSTALL_CONF) ./files/etc/config/dhcp $(1)/etc/config/
	$(INSTALL_CONF) ./files/etc/config/network $(1)/etc/config/
	$(INSTALL_CONF) ./files/etc/config/wireless $(1)/etc/config/

	$(INSTALL_BIN) ./files/etc/init.d/rename-wifi-if-access-point $(1)/etc/init.d

	$(CP) ./files/osjs/* $(1)/osjs
	$(CP) ./files/usr/lib/* $(1)/usr/lib
endef

$(eval $(call BuildPackage,arancino-rpi-scripts))

