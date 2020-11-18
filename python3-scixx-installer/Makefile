#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=python3-scixx-installer
PKG_VERSION:=1.0
PKG_RELEASE:=10

include $(INCLUDE_DIR)/package.mk
$(call include_mk, python3-package.mk)

define Package/$(PKG_NAME)
  SUBMENU:=Python
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=python3-scixx
  DEPENDS:=+python3 +libstdcpp
endef

define Build/Compile
	# NOOP
endef

define Package/$(PKG_NAME)/install
	$(INSTALL_DIR) $(1)/usr/lib/
	$(INSTALL_DIR) $(1)/$(PYTHON3_PKG_DIR)

	tar xzvf ./files/tar/libatlas-base.tar.gz -C $(1)/usr/lib/
	tar xzvf ./files/tar/libatlas.tar.gz -C $(1)/usr/lib/
	tar xzvf ./files/tar/libgfortran.tar.gz -C $(1)/usr/lib/
	tar xzvf ./files/tar/scipy-1.1.0-4.tar.gz -C $(1)$(PYTHON3_PKG_DIR)/
	tar xzvf ./files/tar/scikit_learn-0.19.1-2.tar.gz -C $(1)$(PYTHON3_PKG_DIR)/

	find $(1)$(PYTHON3_PKG_DIR) -name "*.pyc" -delete
	
	$(LN) $(1)/usr/lib/libc.so $(1)/usr/lib/libc.so.3
	$(LN) $(1)/usr/lib/libm.so $(1)/usr/lib/libm.so.6
	$(LN) $(1)/usr/lib/libpthread.so $(1)/usr/lib/libpthread.so.0
	#$(LN) $(1)/usr/lib/libstdc++.so $(1)/usr/lib/libstdc++.so.6
endef

define Package/$(PKG_NAME)/postinst
#!/bin/sh
if [ -e $${IPKG_INSTROOT}/usr/lib/python3.6/site-packages/scipy ]
then
	cd $${IPKG_INSTROOT}/usr/lib/python3.6/site-packages/scipy
	for x in `find . -name '*.cpython-36m-arm-linux-gnueabihf.so'`; do mv $$x `dirname $$x`/`basename $$x .cpython-36m-arm-linux-gnueabihf.so`.cpython-36.so; done
	cd $${IPKG_INSTROOT}/usr/lib/python3.6/site-packages/sklearn
	for x in `find . -name '*.cpython-36m-arm-linux-gnueabihf.so'`; do mv $$x `dirname $$x`/`basename $$x .cpython-36m-arm-linux-gnueabihf.so`.cpython-36.so; done
fi
exit 0
endef


$(eval $(call BuildPackage,$(PKG_NAME)))
