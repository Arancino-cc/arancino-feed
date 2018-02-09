#
# Copyright (C) 2006 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#
# $Id$

include $(TOPDIR)/rules.mk

PKG_NAME:=tcpkill
PKG_VERSION:=1.0
PKG_RELEASE:=1

PKG_SOURCE_PROTO:= git
PKG_REVISION:=v1.0
PKG_SOURCE_VERSION:=$(PKG_VERSION)

PKG_SOURCEi_SUBDIR:=$(PKG_NAME)-v$(PKG_VERSION)
PKG_SOURCE_URL:=https://github.com/Arancino-cc/tcpkill.git
PKG_SOURCE:=$(PKG_NAME)-$(PKG_REVISION).tar.gz
#PKG_MD5SUM:=ec53cd0a702240c48c3b65ae70fd3f40

#PKG_BUILD_DIR:=$(BUILD_DIR)/$(PKG_NAME)

include $(INCLUDE_DIR)/package.mk

define Package/tcpkill
  SECTION:=net
  CATEGORY:=Network
  DEPENDS:=+libpcap +libnet-1.2.x
  TITLE:=A collection of tools for network auditing and penetration testing
  URL:=http://www.monkey.org/~dugsong/dsniff/
endef

define Package/dsniff/description
	A collection of tools for network auditing and penetration testing.
endef

define Build/Compile	
	$(MAKE) -C $(PKG_BUILD_DIR) \
		$(TARGET_CONFIGURE_OPTS) \
		install_prefix="$(PKG_INSTALL_DIR)" \
		CFLAGS+="-Os -pipe -mcpu=cortex-a53 -mfpu=neon-vfpv4 -fno-caller-saves -fno-plt -fhonour-copts -Wno-error=unused-but-set-variable \
			-Wno-error=unused-result -mfloat-abi=hard -I. -I$(STAGING_DIR)/usr/lib/libnet-1.2.x/include/" \
		LDFLAGS+="-L$(STAGING_DIR)/usr/lib -L$(STAGING_DIR)/usr/lib/libnet-1.2.x/lib -lnet -lpcap" \
		tcpkill
endef

define Package/tcpkill/install	
	mkdir -p $(1)/usr/sbin
	$(INSTALL_BIN) $(PKG_BUILD_DIR)/$(PKG_NAME) $(1)/usr/sbin/
endef

$(eval $(call BuildPackage,tcpkill))
