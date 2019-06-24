# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=wstun
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=1.0.11
PKG_RELEASE:=1
PKG_ORG:=@mdslab

PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/MDSLab/wstun.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=f0aa5de3c565c881bdf18d5714c1fca373200f88
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz


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

define Package/node-wstun/install
	$(INSTALL_DIR) $(1)/usr/lib/node_modules/$(PKG_ORG)
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME) $(1)/usr/lib/node_modules/$(PKG_ORG)
	mkdir -p $(1)/var/log/wstun
endef

$(eval $(call BuildPackage,node-wstun))
