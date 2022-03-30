#
# Copyright (c) 2018 Smartme srl All right reserved.
#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NAME:=arancino-osjs
PKG_VERSION:=1.0
PKG_RELEASE:=2

include $(INCLUDE_DIR)/package.mk

define Package/arancino-osjs
  SECTION:=luci
  CATEGORY:=LuCI
  SUBMENU:=3. Applications
  TITLE:=Custom Arancino Osjs support package
  DEFAULT:=m
  DEPENDS:=+luci +luci-lib-json +lua-coxpcall +lua-wsapi-base +lua-wsapi-xavante +lua-base64 +lua-xavante +luafilesystem +iw
endef

define Build/Compile
	# NOOP
endef

define Package/arancino-osjs/install
	$(INSTALL_DIR) $(1)/osjs
	$(INSTALL_DIR) $(1)/usr/lib/lua
	$(INSTALL_DIR) $(1)/usr/lib/lua/luci
	$(INSTALL_DIR) $(1)/etc/uci-defaults

	$(CP) ./files/osjs/* $(1)/osjs
	$(CP) ./files/usr/lib/lua/osjs.lua $(1)/usr/lib/lua
	$(CP) ./files/usr/lib/lua/luci/sysosjs.lua $(1)/usr/lib/lua/luci
	$(CP) ./files/etc/uci-defaults/* $(1)/etc/uci-defaults
endef

define Package/arancino-osjs/postinst
#!/bin/sh
if [ -e $${IPKG_INSTROOT}/etc/config/uhttpd ]
then
	# make the webserver ponting to /osjs instead of /www
	sed -i -e 's/www/osjs\/dist/g' $${IPKG_INSTROOT}/etc/config/uhttpd

	# Linking LUci
	mkdir -p $${IPKG_INSTROOT}//osjs/dist/luci
	ln -sf /www/index.html $${IPKG_INSTROOT}//osjs/dist/luci/index.html
	ln -sf /www/luci-static $${IPKG_INSTROOT}//osjs/dist/luci-static
	ln -sf /www/cgi-bin/luci $${IPKG_INSTROOT}//osjs/dist/cgi-bin/luci
fi
exit 0
endef

$(eval $(call BuildPackage,arancino-osjs))
