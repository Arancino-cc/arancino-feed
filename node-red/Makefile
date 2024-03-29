#
# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=node-red
PKG_NAME:=node-red
#PKG_VERSION:=0.18.7
PKG_VERSION:=0.19.6
PKG_RELEASE:=2

PKG_SOURCE:=$(PKG_NPM_NAME)-$(PKG_VERSION).tgz
PKG_SOURCE_URL:=http://registry.npmjs.com/$(PKG_NPM_NAME)/-/
#PKG_HASH:=aeadc40c65a7c2f4191720dfa56d6f5f10c44df9
PKG_HASH:=50d7e163656ad5c451009c382416ea4fed83cd6f
PKG_MD5SUM:=ad0157da50f2863b024cfa4c5af2ce52

#PKG_SOURCE_PROTO:=git
#PKG_SOURCE_URL:=https://github.com/node-red/node-red.git
#PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
#PKG_SOURCE_VERSION:=aeadc40c65a7c2f4191720dfa56d6f5f10c44df9
#PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION).tar.gz


PKG_BUILD_DEPENDS:=node
PKG_NODE_VERSION:=6.11.4
#PKG_NODE_VERSION:=8.16.0

include $(INCLUDE_DIR)/package.mk

define Package/node-red
  DEPENDS:=+node
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=A visual tool for wiring the Internet of Things
  URL:=https://www.npmjs.org/package/node-red
endef

define Package/node-red/description
	A visual tool for wiring the Internet of Things
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

define Package/node-red/install
	$(INSTALL_DIR) $(1)/usr/lib/node_modules
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/* $(1)/usr/lib/node_modules

	$(INSTALL_DIR) $(1)/usr/bin
	$(LN) ../lib/node_modules/node-red/red.js $(1)/usr/bin/node-red
	$(LN) ../lib/node_modules/node-red/bin/node-red-pi $(1)/usr/bin/node-red-pi

	$(INSTALL_DIR) $(1)/etc/monit.d
	$(CP) ./files/etc/monit.d/* $(1)/etc/monit.d
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

define Package/node-red/postinst
#!/bin/sh
mkdir -p $${IPKG_INSTROOT}/etc/crontabs

CRONTAB_VALUE="0 0 * * 0 /usr/sbin/logrotate -s /var/run/logrotate.status /etc/logrotate.d/node-red.log"

if ! grep -q "node-red.log" $${IPKG_INSTROOT}/etc/crontabs/root; then
    echo "Logrotate configured in cron"
    echo "$${CRONTAB_VALUE}" >>$${IPKG_INSTROOT}/etc/crontabs/root;
else
    echo "Logrotate already configured in cron, overwriting..."
    sed -i "s|.*node-red.*|$${CRONTAB_VALUE}|" $${IPKG_INSTROOT}/etc/crontabs/root;
fi
endef

$(eval $(call BuildPackage,node-red))