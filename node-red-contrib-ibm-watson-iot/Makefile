#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=node-red-contrib-ibm-watson-iot
PKG_NAME:=node-red-contrib-ibm-watson-iot
PKG_VERSION:=0.2.8
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NPM_NAME)-$(PKG_VERSION).tgz
PKG_SOURCE_URL:=http://registry.npmjs.com/$(PKG_NPM_NAME)/-/
PKG_MD5SUM:=53ebf7d58def7d05a26b5f3b6c0e370149296b3f

PKG_BUILD_DEPENDS:=node
PKG_NODE_VERSION:=6.11.4

include $(INCLUDE_DIR)/package.mk

define Package/node-red-contrib-ibm-watson-iot
  DEPENDS:=+node
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=A pair of Node-RED nodes for connecting to the IBM Watson Internet of Things Platform as a Device or Gateway.
  URL:=https://www.npmjs.org/package/node-red-contrib-ibm-watson-iot
endef

define Package/node-red-contrib-ibm-watson-iot/description
	A pair of Node-RED nodes for connecting to the IBM Watson Internet of Things Platform as a Device or Gateway.
endef

NODEJS_CPU:=$(subst powerpc,ppc,$(subst aarch64,arm64,$(subst x86_64,x64,$(subst i386,ia32,$(ARCH)))))

define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
endef

define Build/Compile
	$(MAKE_FLAGS) \
	$(MAKE_VARS) \
	npm_config_arch=$(NODEJS_CPU) \
	npm_config_nodedir=$(BUILD_DIR)/node-v$(PKG_NODE_VERSION)/ \
	npm_config_cache=$(TMP_DIR)/npm-cache \
	PREFIX="$(PKG_INSTALL_DIR)/usr/" \
	$(STAGING_DIR_HOSTPKG)/bin/npm install --target_arch=$(NODEJS_CPU) --build-from-source -g $(DL_DIR)/$(PKG_SOURCE)
endef

define Package/node-red-contrib-ibm-watson-iot/install
	$(INSTALL_DIR) $(1)/usr/lib/node
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/* $(1)/usr/lib/node

	$(INSTALL_DIR) $(1)/usr/bin
	$(LN) ../lib/node/node-red/red.js $(1)/usr/bin/node-red
	$(LN) ../lib/node/node-red/bin/node-red-pi $(1)/usr/bin/node-red-pi
endef

define Package/$(PKG_NAME)/postrm
#!/bin/sh
# check if we are on a real system
if `grep -qs '/opt' /proc/mounts`
then
    rm -rvf /opt/usr/lib/node/$(PKG_NPM_NAME)
else
    rm -rvf /usr/lib/node/$(PKG_NPM_NAME)
fi
endef

$(eval $(call BuildPackage,node-red-contrib-ibm-watson-iot))
