# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=iotronic-lightning-rod
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.xz
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=2.0.4
PKG_RELEASE:=1
PKG_ORG:=@mdslab

PKG_SOURCE_PROTO:=git
#PKG_SOURCE_URL:=https://github.com/MDSLab/s4t-lightning-rod.git
PKG_SOURCE_URL:=https://github.com/Arancino-cc/s4t-lightning-rod.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=d457dc7be2659702f277415d45ccf059705e8bc8
#PKG_SOURCE_VERSION:=2e32eea18b6daf5e8624389ea8366b0a5b36ad8a
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz

PKG_BUILD_DEPENDS:=node libc
PKG_NODE_VERSION:=6.11.4
PKG_USE_MIPS16:=0

include $(INCLUDE_DIR)/package.mk

define Package/node-iotronic-lightning-rod
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=Stack4Things Lightning-rod
  URL:=https://www.npmjs.org/package/iotronic-lightning-rod
  DEPENDS:=+node +libfuse +libpthread
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
	$(INSTALL_DIR) $(1)/usr/lib/node_modules/$(PKG_ORG)
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME) \
	$(1)/usr/lib/node_modules/$(PKG_ORG)
endef

$(eval $(call BuildPackage,node-iotronic-lightning-rod))
