# This is free software, licensed under the GNU General Public License v2.
# See /LICENSE for more information.
#

include $(TOPDIR)/rules.mk

PKG_NPM_NAME:=iotronic-lightning-rod
PKG_NAME:=node-$(PKG_NPM_NAME)
PKG_VERSION:=2.4.1
PKG_RELEASE:=1
PKG_ORG:=@mdslab

PKG_SOURCE_PROTO:=git
PKG_HASH:=e8f796fddb430530bd07544da6136de3a027bcc0
PKG_SHORT_HASH:=e8f796fd
PKG_SOURCE:=$(PKG_NAME)-$(PKG_VERSION)-g$(PKG_SHORT_HASH).tar.gz
PKG_SOURCE_URL:=ssh://git@git.smartme.io:20022/consulting/sacertis/iotronic-lightning-rod.git
PKG_SOURCE_SUBDIR:=$(PKG_NAME)-$(PKG_VERSION)
PKG_SOURCE_VERSION:=$(PKG_HASH)

PKG_NODE_VERSION:=6.11.4
PKG_USE_MIPS16:=0

include $(INCLUDE_DIR)/package.mk

define Package/node-iotronic-lightning-rod
  SUBMENU:=Node.js
  SECTION:=lang
  CATEGORY:=Languages
  TITLE:=Stack4Things Lightning-rod
  URL:=https://www.npmjs.org/package/iotronic-lightning-rod
  DEPENDS:=+node +libfuse +libpthread +libc +gdb +node-lsof +patch +logrotate
endef

define Package/node-iotronic-lightning-rod/description
	Stack4Things Lightning-rod
endef

NODEJS_CPU:=$(subst powerpc,ppc,$(subst aarch64,arm64,$(subst x86_64,x64,$(subst i386,ia32,$(ARCH)))))

TARGET_CFLAGS += -I$(STAGING_DIR)/usr/include/fuse

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

define Package/node-iotronic-lightning-rod/install
	# $(INSTALL_DIR) $(1)/etc/uci-defaults
	$(INSTALL_DIR) $(1)/usr/lib/node_modules/$(PKG_ORG)
	$(CP) $(PKG_INSTALL_DIR)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME) \
	$(1)/usr/lib/node_modules/$(PKG_ORG)
	# $(CP) ./files/uci-defaults/58_var_config $(1)/etc/uci-defaults
	# chmod +x $(1)/etc/uci-defaults/*
	chmod +x $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/utils/install/arancino/*

	# Configure IoTronic ENV
	mkdir -p $(1)/var/lib/iotronic
	mkdir -p $(1)/var/lib/iotronic/plugins
	mkdir -p $(1)/var/lib/iotronic/drivers

	# Manage Lightning-rod patches
	mkdir -p $(1)/var/lib/iotronic/patches
	$(CP) ./files/patches/* $(1)/var/lib/iotronic/patches

	mkdir -p $(1)/usr/bin
	$(INSTALL_BIN) $(1)/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/utils/install/arancino/configure_LR_arancino.sh $(1)/usr/bin/configure_LR_arancino
	$(INSTALL_BIN) $(1)/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/utils/install/arancino/board_bkp_rest.sh $(1)/usr/bin/board_bkp_rest

	# Not overwrite settings.json
	#$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/settings.example.json $(1)/var/lib/iotronic/settings.json
	#$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/modules/plugins-manager/plugins.example.json $(1)/var/lib/iotronic/plugins/plugins.json
	#$(CP) $(1)/usr/lib/node_modules/$(PKG_ORG)/$(PKG_NPM_NAME)/modules/drivers-manager/drivers.example.json $(1)/var/lib/iotronic/drivers/drivers.json

	# Configure IoTronic Log
	mkdir -p $(1)/var/log/iotronic
	mkdir -p $(1)/var/log/iotronic/plugins
	mkdir -p $(1)/etc/logrotate.d
	touch $(1)/var/log/iotronic/lightning-rod.log
	# $(INSTALL_DATA) $(PKG_BUILD_DIR)/etc/logrotate.d/lightning-rod.log $(1)/etc/logrotate.d/lightning-rod.log
	$(INSTALL_DATA) ./files/etc/logrotate.d/lightning-rod.log $(1)/etc/logrotate.d/lightning-rod.log

	# configure init.d
	$(INSTALL_DIR) $(1)/etc/init-cfg/
	$(INSTALL_BIN) ./files/etc/init-cfg/lightning-rod $(1)/etc/init-cfg/lightning-rod

	# configure monit
	$(INSTALL_DIR) $(1)/etc/monit.d
	$(CP) ./files/etc/monit.d/* $(1)/etc/monit.d

	# configure pluginExec
	$(INSTALL_BIN) $(1)/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/utils/pluginExec/create_plugin_env $(1)/usr/bin/create_plugin_env


endef

define Package/node-iotronic-lightning-rod/preinst
#!/bin/sh

# Manage Lightning-rod patches
mkdir -p $${IPKG_INSTROOT}/var/lib/iotronic/patches
if [ -e $${IPKG_INSTROOT}/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/package.json ]
then
	cp $${IPKG_INSTROOT}/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/package.json $${IPKG_INSTROOT}/var/lib/iotronic/patches/package.json
fi
exit 0
endef

define Package/node-iotronic-lightning-rod/postinst
#!/bin/sh

# if on buildroot, make a uci-defaults script which will delete the startup script automatically created
if [ -n "$${IPKG_INSTROOT}" ]; then
        echo "Creating uci-default script to disable connectivityservice in factory image"
        echo "rm -f /etc/rc.d/S99lightning-rod" > $${IPKG_INSTROOT}/etc/uci-defaults/lightning-rod.disable
fi

if [ -e $${IPKG_INSTROOT}/var/lib/iotronic/settings.json ]
then
	# set the new default password
	logger -t DEBUG "Settings file already present"
else
	logger -t DEBUG "Settings file missing. Add a default one $${PKG_ORG}/$${PKG_NPM_NAME}"
	cp $${IPKG_INSTROOT}/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/utils/templates/settings.example.json $${IPKG_INSTROOT}/var/lib/iotronic/settings.json
	cp $${IPKG_INSTROOT}/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/modules/plugins-manager/plugins.example.json $${IPKG_INSTROOT}/var/lib/iotronic/plugins/plugins.json
	cp $${IPKG_INSTROOT}/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/modules/drivers-manager/drivers.example.json $${IPKG_INSTROOT}/var/lib/iotronic/drivers/drivers.json
fi


if [ -e $${IPKG_INSTROOT}/etc/iotronic/authentication.json ]
then
        LR_INSTALLED_VERSION=`cat /var/lib/iotronic/patches/package.json | grep \"version\" | awk '{print $$2}' | tr -d , | tr -d \"`
        # set the new default password
        logger -t DEBUG "Authentication settings file already present ver: $${LR_INSTALLED_VERSION}"

        if [ "$${LR_INSTALLED_VERSION}" == "2.2.0" ]; then
                        logger -t DEBUG "APPLY THE 2.3.0 PATCH"
                        patch /etc/iotronic/authentication.json /var/lib/iotronic/patches/authentication.patch
                        rm -rf /var/lib/iotronic/patches/
	fi

else
        logger -t DEBUG "Authentication settings file missing. Added..."
        mkdir -p $${IPKG_INSTROOT}/etc/iotronic/
        cp $${IPKG_INSTROOT}/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/utils/templates/authentication.example.json $${IPKG_INSTROOT}/etc/iotronic/authentication.json
fi

if [ -e $${IPKG_INSTROOT}/etc/init.d/lightning-rod ]
then
	logger -t DEBUG "Updating init.d/lightning-rod"
	cp $${IPKG_INSTROOT}/etc/init-cfg/lightning-rod $${IPKG_INSTROOT}/etc/init.d
fi

if [ "`grep IOTRONIC_HOME $${IPKG_INSTROOT}/etc/profile`" == "" ]
then
        # Configure Profile
        echo "export NODE_PATH=/usr/lib/node_modules" >> $${IPKG_INSTROOT}/etc/profile
        echo "export IOTRONIC_HOME=/var/lib/iotronic" >> $${IPKG_INSTROOT}/etc/profile
        echo "export LIGHTNINGROD_HOME=/usr/lib/node_modules/@mdslab/iotronic-lightning-rod" >> $${IPKG_INSTROOT}/etc/profile
        echo "export NODE_TLS_REJECT_UNAUTHORIZED=0" >> $${IPKG_INSTROOT}/etc/profile

        source $${IPKG_INSTROOT}/etc/profile
        #export NODE_PATH=/usr/lib/node_modules
        #export IOTRONIC_HOME=/var/lib/iotronic
        #export LIGHTNINGROD_HOME=/usr/lib/node_modules/@mdslab/iotronic-lightning-rod
        #export NODE_TLS_REJECT_UNAUTHORIZED=0

        echo "Environment configured."
else
        echo "Environment already configured"
fi

CRONTAB_VALUE="0 0 * * 0 /usr/sbin/logrotate -s /var/run/logrotate.status /etc/logrotate.d/lightning-rod.log"

mkdir -p $${IPKG_INSTROOT}/etc/crontabs

if ! grep -q "lightning-rod.log" $${IPKG_INSTROOT}/etc/crontabs/root; then
	echo "Logrotate configured in cron"
	echo "$${CRONTAB_VALUE}" >>$${IPKG_INSTROOT}/etc/crontabs/root;
else
	echo "Logrotate already configured in cron, overwriting..."
	sed -i "s|.*lightning-rod.*|$${CRONTAB_VALUE}|"  $${IPKG_INSTROOT}/etc/crontabs/root;
fi

#if [ "`grep $${IPKG_INSTROOT}/etc/init.d/lightning-rod $${IPKG_INSTROOT}/etc/crontabs/root`" == "" ]
#then
#        cp $${IPKG_INSTROOT}/usr/lib/node_modules/@mdslab/iotronic-lightning-rod/etc/cron.d/root_openwrt $${IPKG_INSTROOT}/etc/crontabs/root
#        echo "Cron configured."
#else
#        echo "Cron already configured"
#fi

exit 0
endef

$(eval $(call BuildPackage,node-iotronic-lightning-rod))
