# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=lsof
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=0.1.0
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NPM_NAME)-$(PKG_VERSION).tgz
PKG_SOURCE_URL:=http://registry.npmjs.org/$(PKG_NPM_NAME)/-/
PKG_HASH:=ca8b6229528efecd6b47f6b67a98c22c90aed6122d005f0d0d4da49117812ec5

PKG_BUILD_DEPENDS:=node
PKG_NODE_VERSION:=6.11.4
PKG_USE_MIPS16:=0

include $(INCLUDE_DIR)/package.mk

define Package/node-lsof
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=Node bindings for lsof
  URL:=https://www.npmjs.org/package/lsof
  DEPENDS:=+node
endef

define Package/node-lsof/description
 Node bindings for lsof
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

define Package/node-lsof/install
	$(INSTALL_DIR) $(1)/usr/lib/node_modules
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_NPM_NAME) $(1)/usr/lib/node_modules
endef

$(eval $(call BuildPackage,node-lsof))
