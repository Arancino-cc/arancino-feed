#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=influxdb
PKG_VERSION_NAME:=1.5.4
#PKG_VERSION_NAME:=1.4.2
PKG_VERSION:=$(PKG_VERSION_NAME)-1
PKG_RELEASE:=3

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION_NAME)_linux_armhf.tar.gz
PKG_SOURCE_URL:=https://dl.influxdata.com/influxdb/releases/
PKG_SOURCE_VERSION:=ae9914f9e2fdfabef7a3b402fc1063296fd997e2fb2beb4042ff93f18cf7567f

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)
  SUBMENU:=Utilities
  SECTION:=lang
  CATEGORY:=database
  TITLE:=influxdb
  DEPENDS:=
endef

define Package/influxdb/description
InfluxDB is used as a data store for any use case involving large amounts of timestamped data,
including DevOps monitoring, application metrics, IoT sensor data, and real-time analytics.
endef

define Package/influxdb/conffiles
/etc/config/influxdb
endef


define Build/Compile
	# NOOP
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/etc/logrotate.d
	$(INSTALL_DIR) $(1)/var/lib/influxdb
	$(INSTALL_DIR) $(1)/var/log/influxdb
	$(INSTALL_DIR) $(1)/usr/lib/influxdb/scripts
	$(INSTALL_DIR) $(1)/usr/share/man/man1
	$(INSTALL_DIR) $(1)/usr/bin

	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/influxdb.init $(1)/etc/init.d/influxdb

	$(INSTALL_DIR) $(1)/etc/config
	$(INSTALL_CONF) ./files/influxdb.conf $(1)/etc/config/influxdb

	$(CP) $(PKG_BUILD_DIR)/etc/logrotate.d/influxdb $(1)/etc/logrotate.d
	#$(CP) $(PKG_BUILD_DIR)/etc/influxdb/* $(1)/etc/influxdb
	$(CP) $(PKG_BUILD_DIR)/usr/lib/influxdb/scripts/* $(1)/usr/lib/influxdb/scripts
	$(CP) $(PKG_BUILD_DIR)/usr/share/man/man1/* $(1)/usr/share/man/man1
	$(CP) $(PKG_BUILD_DIR)/usr/bin/* $(1)/usr/bin
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
