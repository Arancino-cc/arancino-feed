# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=iotronic-lightning-rod
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.xz
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=2.1.2
PKG_RELEASE:=7
PKG_MD5SUM:=d32dca94a2675bd958668f42c2666c1d4b32166c
PKG_ORG:=@mdslab

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MDSLab/s4t-lightning-rod.git
PKG_REV:=release-v2.1.2
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=$(PKG_REV)
#PKG_SOURCE_VERSION:=7b18982d5b4b279439d904daa29759cde958b37e
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz

PKG_BUILD_DEPENDS:=node libc libpthread
PKG_NODE_VERSION:=6.11.4
PKG_USE_MIPS16:=0

include $(INCLUDE_DIR)/package.mk

define Package/node-iotronic-lightning-rod
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=Stack4Things Lightning-rod
  URL:=https://www.npmjs.org/package/iotronic-lightning-rod
  DEPENDS:=+node +libfuse +libpthread +libc
endef

define Package/node-iotronic-lightning-rod/description
	Stack4Things Lightning-rod
endef

NODEJS_CPU:=$(subst powerpc,ppc,$(subst aarch64,arm64,$(subst x86_64,x64,$(subst i386,ia32,$(ARCH)))))

define Build/Prepare
        $(INSTALL_DIR) $(PKG_BUILD_DIR)
endef

define Build/Compile
	$(MAKE_VARS) \
	$(MAKE_FLAGS) \
	npm_config_arch=$(NODEJS_CPU) \
	npm_config_nodedir=$(STAGING_DIR)/usr/ \
	npm_config_cache=$(TMP_DIR)/npm-cache \
	npm_config_tmp=$(TMP_DIR)/npm-tmp \
	PREFIX="$(PKG_INSTALL_DIR)/usr/" \
	$(STAGING_DIR_HOSTPKG)/bin/npm install --build-from-source --target_arch=$(NODEJS_CPU) -g $(DL_DIR)/$(PKG_SOURCE)
	rm -rf $(TMP_DIR)/npm-tmp
	rm -rf $(TMP_DIR)/npm-cache
endef

define Package/node-iotronic-lightning-rod/install
	$(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/usr/lib/node_modules/$(PKG_ORG)
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME) \
	$(1)/usr/lib/node_modules/$(PKG_ORG)
	$(CP) ./files/uci-defaults/58_var_config $(1)/etc/uci-defaults
	chmod +x $(1)/etc/uci-defaults/*
	# chmod +x $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/utils/install/arancino/*

	# Configure IoTronic ENV
	mkdir -p $(1)/var/lib/iotronic/
	mkdir -p $(1)/var/lib/iotronic/plugins
	mkdir -p $(1)/var/lib/iotronic/drivers
	
	# Not overwrite settings.json
	#$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/settings.example.json $(1)/var/lib/iotronic/settings.json
	#$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/modules/plugins-manager/plugins.example.json $(1)/var/lib/iotronic/plugins/plugins.json
	#$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/modules/drivers-manager/drivers.example.json $(1)/var/lib/iotronic/drivers/drivers.json

	# Configure IoTronic Log
	mkdir -p $(1)/var/log/iotronic/plugins
	touch $(1)/var/log/iotronic/lightning-rod.log
	$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/etc/logrotate.d/lightning-rod.log $(1)/etc/logrotate.d/lightning-rod.log

	# Configure Profile
	@echo "export NODE_PATH=/usr/lib/node_modules" >> $(1)/etc/profile
	@echo "export IOTRONIC_HOME=/var/lib/iotronic" >> $(1)/etc/profile
	@echo "export LIGHTNINGROD_HOME=/usr/lib/node_modules/@mdslab/iotronic-lightning-rod" >> $(1)/etc/profile
	@echo "export NODE_TLS_REJECT_UNAUTHORIZED=0" >> $(1)/etc/profile

	# configure init.d 
	$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/etc/init.d/s4t-lightning-rod_openwrt /etc/init.d/lightning-rod
	sed -i "s/<LIGHTNINGROD_HOME>/export LIGHTNINGROD_HOME=\/usr\/lib\/node_modules\/@mdslab\/iotronic-lightning-rod/g" $(1)/etc/init.d/lightning-rod
	chmod +x $(1)/etc/init.d/lightning-rod

	# Configure cron
	$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/etc/cron.d/root_openwrt $(1)/etc/crontabs/root

endef

define Package/node-iotronic-lightning-rod/postinst
#!/bin/sh
if [ -e $${IPKG_INSTROOT}/var/lib/iotronic/settings.json ]
then
	# set the new default password
	logger -t DEBUG "Settings file already present"
fi
exit 0
endef

$(eval $(call BuildPackage,node-iotronic-lightning-rod))
