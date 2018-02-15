# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=statvfs
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=3.0.0
PKG_RELEASE:=1

PKG_SOURCE_PROTO:=git
#PKG_SOURCE_URL:=https://github.com/MDSLab/s4t-lightning-rod.git
PKG_SOURCE_URL:=https://github.com/PlayNetwork/node-statvfs.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=9e81580a8eec06a19eee5f29e6597175a622ba09
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz


PKG_BUILD_DEPENDS:=node
PKG_NODE_VERSION:=6.11.4
PKG_USE_MIPS16:=0

PKG_MAINTAINER:=Hirokazu MORIKAWA <morikw2@gmail.com>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=README.md

include $(INCLUDE_DIR)/package.mk

define Package/node-statvfs
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=node binding to POSIX statvfs (file system information)
  URL:=https://www.npmjs.org/package/statvfs
  DEPENDS:=+node
endef

define Package/node-statvfs/description
 statvfs is a super simple module that just gives you access to statvfs(3)
endef

TAR_OPTIONS+= --strip-components 1
TAR_CMD=$(HOST_TAR) -C $(1) $(TAR_OPTIONS)

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

define Package/node-statvfs/install
	$(INSTALL_DIR) $(1)/usr/lib/node_modules
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_NPM_NAME) $(1)/usr/lib/node_modules
endef

$(eval $(call BuildPackage,node-statvfs))
