#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=node-red-node-serialport
PKG_NAME:=node-red-node-serialport
PKG_VERSION:=0.6.6
PKG_RELEASE:=1

#PKG_SOURCE:=$(PKG_NPM_NAME)-$(PKG_VERSION).tgz
#PKG_SOURCE_URL:=http://registry.npmjs.com/$(PKG_NPM_NAME)/-/
#PKG_MD5SUM:=0253f67882b9bfc60be5a9c2d32723e1729adedf
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/Arancino-cc/node-red-nodes.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=66eaab16cd9f907c4d20e869e9ce981ed0bad574
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz

PKG_BUILD_DEPENDS:=node
PKG_NODE_VERSION:=6.11.4

include $(INCLUDE_DIR)/package.mk

define Package/node-red-node-serialport
  DEPENDS:=+node
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=Node-RED nodes to talk to hardware Serial ports. 
  URL:=https://www.npmjs.org/package/node-red-node-serialport
endef

define Package/node-red-node-serialport/description
	Node-RED nodes to talk to hardware Serial ports.
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

define Package/node-red-node-serialport/install
	$(INSTALL_DIR) $(1)/usr/lib/node_modules
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/* $(1)/usr/lib/node_modules
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

$(eval $(call BuildPackage,node-red-node-serialport))
