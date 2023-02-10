# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=q
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=1.5.1
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NPM_NAME)-$(PKG_VERSION).tgz
PKG_SOURCE_URL:=https://registry.npmjs.org/$(PKG_NPM_NAME)/-/
PKG_HASH:=1dd19705a0be2217f63ab35aa4a93ccb

PKG_BUILD_DEPENDS:=node
PKG_NODE_VERSION:=6.11.4
PKG_USE_MIPS16:=0

include $(INCLUDE_DIR)/package.mk

define Package/node-q
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=When work on Q began, promises were an academic novelty in JavaScript
  URL:=https://www.npmjs.org/package/q
  DEPENDS:=+node
endef

define Package/node-q/description
  When work on Q began, promises were an academic novelty in JavaScript,
  unlikely to be adopted much less popular, though obviously full of…promise
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

define Package/node-q/install
	$(INSTALL_DIR) $(1)/usr/lib/node_modules
	$(CP) -r $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_NPM_NAME) $(1)/usr/lib/node_modules
	# mkdir -p $(1)/var/log/q
endef

$(eval $(call BuildPackage,node-q))