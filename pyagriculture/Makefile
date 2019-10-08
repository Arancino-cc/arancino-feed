#
# Copyright (C) 2007-2015 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=pyagriculture
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=ssh://git@git.smartme.io:20022/consulting/Inverness/pyagriculture.git
PKG_SOURCE_VERSION:=b303f7fe4e3eb6f16fafbfb73596b798cd241478
PKG_MIRROR_HASH:=e936630bec42c3621664dc876699f6392dbb22dd3dd163a08191991bb37a7872

include $(INCLUDE_DIR)/package.mk

define Package/$(PKG_NAME)/Default
  URL:=https://git.smartme.io/consulting/Inverness/pyagriculture
  TITLE:=Utility
endef

define Package/$(PKG_NAME)
  $(call Package/$(PKG_NAME)/Default)
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE+=tools for Linux
  DEPENDS+=+python3-influxdb
endef

define Build/Compile
        # NOOP
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/pyagriculture $(1)/etc/init.d/
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/*.py $(1)/usr/bin/
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
