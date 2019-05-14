# Copyright (C) 2017 Stijn Tintel <stijn@linux-ipv6.be>
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.

include $(TOPDIR)/rules.mk

PKG_NAME:=raspberrypi-userland
PKG_RELEASE:=2

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/raspberrypi/userland.git
PKG_SOURCE_DATE:=2019-05-01
PKG_SOURCE_VERSION:=517cdc30da167d81a485e7a994e02cec2390a269

include $(INCLUDE_DIR)/package.mk
include $(INCLUDE_DIR)/cmake.mk

define Package/raspberrypi-userland
  SECTION:=libs
  CATEGORY:=Libraries
  DEPENDS:=@TARGET_brcm2708
  TITLE:=raspberrypi-userland
  URL:=https://github.com/raspberrypi/userland
  MAINTAINER:=Stijn Tintel <stijn@linux-ipv6.be>
endef

define Package/mmal/description
  Source code for ARM side libraries for interfacing to Raspberry Pi GPU.
endef

CMAKE_OPTIONS += \
	-DALL_APPS=0 \
	-DVMCS_INSTALL_PREFIX=/usr

define Package/raspberrypi-userland/install
	$(INSTALL_DIR) $(1)/usr/lib
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/lib/*.so* $(1)/usr/lib
	$(INSTALL_DIR) $(1)/usr/bin
	$(INSTALL_BIN) $(PKG_INSTALL_DIR)/usr/bin/* $(1)/usr/bin
endef
define Build/InstallDev
	$(INSTALL_DIR) $(1)/usr/include $(1)/usr/lib
	$(CP) $(PKG_INSTALL_DIR)/usr/include/* $(1)/usr/include
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/{pkgconfig,*.{a,so}*} $(1)/usr/lib
endef

$(eval $(call BuildPackage,raspberrypi-userland))
