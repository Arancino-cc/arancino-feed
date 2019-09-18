#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-obspy-installer
PKG_VERSION:=1.1.1
PKG_RELEASE:=1

include $(INCLUDE_DIR)/package.mk
include $(TOPDIR)/feeds/packages/lang/python/python3-package.mk

define Package/$(PKG_NAME)
  SUBMENU:=Python
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=python3-obspy
  DEPENDS:=+python3 +libxslt +libexslt +libfreetype +libstdcpp
endef

define Build/Compile
	# NOOP
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/$(PYTHON3_PKG_DIR)

	tar xzvf ./files/tar/python3-obspy-1.1.1.tar.gz -C $(1)$(PYTHON3_PKG_DIR)/

	find $(1)$(PYTHON3_PKG_DIR) -name "*.pyc" -delete
endef

$(eval $(call BuildPackage,$(PKG_NAME)))
