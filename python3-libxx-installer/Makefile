#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-libxx-installer
PKG_VERSION:=1.0
PKG_RELEASE:=10

include $(INCLUDE_DIR)/package.mk
$(call include_mk, python3-package.mk)

define Package/$(PKG_NAME)
  SUBMENU:=Python
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=python3-libxx
  DEPENDS:=+python3 +libstdcpp +libncurses
endef

define Build/Compile
	# NOOP
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/$(PYTHON3_PKG_DIR)

	tar xzvf ./files/tar/libtinfo.so.5.tar.gz -C $(1)/usr/lib/
	tar xzvf ./files/tar/readline-6.2.4.1-1.tar.gz -C $(1)$(PYTHON3_PKG_DIR)/
	tar xzvf ./files/tar/python3.6-pandas-0.23-1.tar.gz -C $(1)$(PYTHON3_PKG_DIR)/
	tar xzvf ./files/tar/python3.6-pytz-2018.4.tar.gz -C $(1)$(PYTHON3_PKG_DIR)/
	tar xzvf ./files/tar/python3.6-dateutil.tar.gz -C $(1)$(PYTHON3_PKG_DIR)/
	tar xzvf ./files/tar/python3-server-lib.tar.gz -C $(1)$(PYTHON3_PKG_DIR)/

	find $(1)$(PYTHON3_PKG_DIR) -name "*.pyc" -delete
	$(LN) $(1)/usr/lib/libtinfo.so.5 $(1)/usr/lib/libtinfo.so
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
	cd $${IPKG_INSTROOT}/usr/lib/python3.6/site-packages/
	#mv readline.cpython-36m-arm-linux-gnueabihf.so readline.cpython-36.so
	for x in `find . -name '*.cpython-36m-arm-linux-gnueabihf.so'`; do mv $$x `dirname $$x`/`basename $$x .cpython-36m-arm-linux-gnueabihf.so`.cpython-36.so; done
	
	if [ ! -e $${IPKG_INSTROOT}/usr/lib/libncurses.so.5 ]
	then
		ln $${IPKG_INSTROOT}/usr/lib/libncurses.so $${IPKG_INSTROOT}/usr/lib/libncurses.so.5
	fi
exit 0
endef


$(eval $(call BuildPackage,$(PKG_NAME)))
