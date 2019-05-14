#
# Copyright (C) 2007-2015 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=iotop
PKG_VERSION:=0.0.1
PKG_RELEASE:=1
PKG_REV:=cadd9675822cc02eace137eb918a4362c69bec9e

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/Tomas-M/iotop.git
PKG_SOURCE_VERSION:=$(PKG_REV)
#PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.bz2
PKG_HASH:=cadd9675822cc02eace137eb918a4362c69bec9e

PKG_BUILD_PARALLEL:=1

include $(INCLUDE_DIR)/package.mk

define Package/iotop/Default
  URL:=https://github.com/Tomas-M/iotop
  TITLE:=Utility
endef

define Package/iotop
  $(call Package/iotop/Default)
  SECTION:=utils
  CATEGORY:=Utilities
  TITLE+=tools for Linux
  DEPENDS+=+libncursesw
endef

TARGET_CPPFLAGS += -I$(PKG_BUILD_DIR)/include
TARGET_LDFLAGS += -lncurses

define Build/Compile
	$(MAKE) -C $(PKG_BUILD_DIR) \
		LINUX="$(LINUX_DIR)" \
		CC="$(TARGET_CC)" \
		STAGING_DIR="$(STAGING_DIR)" \
		LDFLAGS="$(TARGET_LDFLAGS)" \
		CFLAGS="$(TARGET_CFLAGS)"
endef

define Package/iotop/install
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/iotop $(1)/usr/bin/
endef

$(eval $(call BuildPackage,iotop))
