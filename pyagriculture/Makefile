#
# Copyright (C) 2008-2015 OpenWrt.org
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_FILE_NAME:=pyagriculture
PKG_NAME:=$(PKG_FILE_NAME)
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_FILE_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_URL:=https://git.smartme.io/consulting/Inverness/pyagriculture/-/archive/$(PKG_VERSION)/
PKG_HASH:=5448b99bc1b6578d2173b8d3bc96b6569746e982466d2c312bebb8bcd66fc86f

PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=COPYING
PKG_MAINTAINER:=Mimmo <mimmo@smartme.io>

PKG_BUILD_DIR:=$(BUILD_DIR)/$(BUILD_VARIANT)-$(PKG_NAME)-$(PKG_VERSION)
PKG_UNPACK=$(HOST_TAR) -C $(PKG_BUILD_DIR) --strip-components=1 -xzf $(DL_DIR)/$(PKG_SOURCE)
#Need to add because python 3.7 deosn't build 
MYPYTHON_VERSION:=3.7
MYPYTHON_PKG_DIR:=/usr/lib/python$(MYPYTHON_VERSION)/site-packages
BUILD_PYTHON_VERSION:=3.6
BUILD_PYTHON_PKG_DIR:=/usr/lib/python$(BUILD_PYTHON_VERSION)/site-packages

include $(INCLUDE_DIR)/package.mk

define Package/python-$(PKG_NAME)/Default
  SUBMENU:=Python
  SECTION:=lang
  CATEGORY:=Languages
  DEPENDS:=+pyserial +redis +influxdb
endef

define Package/python3-$(PKG_NAME)
$(call Package/$(PKG_NAME)/Default)
  TITLE:=Receives commands from Arancino Library (uC) trough the Arancino Cortex Protocol over serial connection
  VARIANT:=python3
endef

define Package/python3-$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/etc/init.d
	$(INSTALL_BIN) ./files/etc/init.d/pyagriculture $(1)/etc.init.d
	$(INSTALL_DIR) $(1)$(MYPYTHON_PKG_DIR)
	$(CP) \
		$(PKG_INSTALL_DIR)$(BUILD_PYTHON_PKG_DIR)/* \
		$(1)$(MYPYTHON_PKG_DIR)
endef

$(eval $(call Py3Package,python3-$(PKG_NAME)))
