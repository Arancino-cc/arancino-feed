# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=wstun
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=1.0.3
PKG_RELEASE:=1
PKG_ORG:=@mdslab

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MDSLab/wstun.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=90118cb6d5a91057790563cfd9e9bc86ad06c568
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.xz


PKG_BUILD_DEPENDS:=node
PKG_NODE_VERSION:=6.11.4
PKG_USE_MIPS16:=0

include $(INCLUDE_DIR)/package.mk

define Package/node-wstun
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=Tunnels and Reverse Tunnels over WebSocket for Node.js
  URL:=https://www.npmjs.org/package/wstun
  DEPENDS:=+node
endef

define Package/node-wstun/description
 Tunnels and Reverse Tunnels over WebSocket for Node.js
endef

#TAR_OPTIONS+= --strip-components 1
#TAR_CMD=$(HOST_TAR) -C $(1) $(TAR_OPTIONS)

NODEJS_CPU:=$(subst powerpc,ppc,$(subst aarch64,arm64,$(subst x86_64,x64,$(subst i386,ia32,$(ARCH)))))

define Build/Compile
	$(MAKE_VARS) \
	$(MAKE_FLAGS) \
	npm_config_arch=$(NODEJS_CPU) \
	npm_config_nodedir=$(STAGING_DIR)/usr/ \
	npm_config_cache=$(TMP_DIR)/npm-cache \
	npm_config_tmp=$(TMP_DIR)/npm-tmp \
	PREFIX="$(PKG_INSTALL_DIR)/usr/" \
	$(STAGING_DIR_HOSTPKG)/bin/npm install --build-from-source --target_arch=$(NODEJS_CPU) -g $(PKG_BUILD_DIR)
	rm -rf $(TMP_DIR)/npm-tmp
	rm -rf $(TMP_DIR)/npm-cache
endef

define Package/node-wstun/install
	$(INSTALL_DIR) $(1)/usr/lib/node_modules
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME) \
	$(1)/usr/lib/node_modules

#	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME} \
	$(1)/usr/lib/node_modules
endef

$(eval $(call BuildPackage,node-wstun))
