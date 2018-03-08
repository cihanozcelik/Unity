var readlineSync = require("readline-sync");
var config = require("./configuration");
var octokitWrapper = require("./octokit");

function ApiWrapper() {
    this.octokit = octokitWrapper.createOctokit();

    if (!config.user || !config.token) {
        throw "User and/or Token missing";
    }

    this.octokit.authenticate({
        type: "oauth",
        token: config.token
    });
}

ApiWrapper.prototype.verifyUser = function (callback) {
    this.octokit.users.get({}, function (error, result) {
        callback(error, (!result) ? null : {
            login: result.data.login,
            name: result.data.name || '',
        });
    });
};

ApiWrapper.prototype.getOrgs = function (callback) {
    var perPageCount = 100;
    var organizations = [];
    var position = { page: 1, per_page: perPageCount };

    var that = this;
    var getOrgsAtPosition = function () {
        that.octokit.users.getOrgs(position, function (error, result) {
            if (error) {
                callback(error, null);
            } else {
                for (var index = 0; index < result.data.length; index++) {
                    var element = result.data[index];
                    organizations.push(element);
                }

                if (result.data.length == perPageCount) {
                    position.page = position.page + 1;
                    getOrgsAtPosition();
                }
                else {
                    var organizationLogins = organizations.map(function (item) {
                        return {
                            name: item.name || "",
                            login: item.login
                        };
                    });

                    callback(null, organizationLogins);
                }
            }
        });
    }

    getOrgsAtPosition();
};

ApiWrapper.prototype.publish = function (name, desc, private, organization, callback) {
    if (organization) {
        this.octokit.repos.createForOrg({
            org: organization,
            name: name,
            description: desc,
            private: private
        }, function (error, result) {
            callback(error, (!result) ? null : result.data.git_url);
        });
    }
    else {
        this.octokit.repos.create({
            name: name,
            description: desc,
            private: private
        }, function (error, result) {
            callback(error, (!result) ? null : result.data.git_url);
        });
    }
};

module.exports = ApiWrapper;