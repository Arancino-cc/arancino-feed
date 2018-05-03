#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=serialport
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=6.2.2
PKG_RELEASE:=1

PKG_SOURCE:=$(PKG_NPM_NAME)-$(PKG_VERSION).tar.gz
PKG_SOURCE_PROTO:=git
PKG_SOURCE_URL:=https://github.com/node-serialport/node-serialport.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=4ed5182ceb4196be9b541660ce20d951a8f9c8e3
#PKG_SOURCE_URL:=http://registry.npmjs.org/$(PKG_NPM_NAME)/-/
#PKG_HASH:=4ed5182ceb4196be9b541660ce20d951a8f9c8e3

PKG_BUILD_DEPENDS:=node
PKG_NODE_VERSION:=6.11.4
PKG_USE_MIPS16:=0

PKG_MAINTAINER:=Hirokazu MORIKAWA <morikw2@gmail.com>
PKG_LICENSE:=MIT
PKG_LICENSE_FILES:=LICENSE

include $(INCLUDE_DIR)/package.mk

define Package/node-serialport
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=Node.js package to access serial ports
  URL:=https://www.npmjs.org/package/serialport
  DEPENDS:=+node
endef

define Package/node-serialport/description
 Node.js package to access serial ports. Welcome your robotic javascript overlords. Better yet, program them!
endef

NODEJS_CPU:=$(subst powerpc,ppc,$(subst aarch64,arm64,$(subst x86_64,x64,$(subst i386,ia32,$(ARCH)))))


TAR_OPTIONS+= --strip-components 1
TAR_CMD=$(HOST_TAR) -C $(1) $(TAR_OPTIONS)

define Build/Prepare
	$(INSTALL_DIR) $(PKG_BUILD_DIR)
endef

define Build/Compile
	$(MAKE_FLAGS) \
	$(MAKE_VARS) \
	npm_config_arch=$(NODEJS_CPU) \
	npm_config_nodedir=$(BUILD_DIR)/node-v$(PKG_NODE_VERSION) \
	npm_config_cache=$(TMP_DIR)/npm-cache \
	PREFIX="$(PKG_INSTALL_DIR)/usr/" \
	$(STAGING_DIR_HOSTPKG)/bin/npm install --target_arch=$(NODEJS_CPU) --build-from-source -g $(DL_DIR)/$(PKG_SOURCE)
endef

define Package/node-serialport/install
	$(INSTALL_DIR) $(1)/usr/lib/node_modules
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_NPM_NAME) $(1)/usr/lib/node_modules

	$(INSTALL_DIR) $(1)/usr/bin
	$(LN) ../lib/node/serialport/bin/list.js $(1)/usr/bin/serialport-list
	$(LN) ../lib/node/serialport/bin/repl.js $(1)/usr/bin/serialport-repl
	$(LN) ../lib/node/serialport/bin/terminal.js $(1)/usr/bin/serialport-term
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

$(eval $(call BuildPackage,node-serialport))
