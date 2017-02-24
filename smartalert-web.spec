%define smartmetroot /smartmet

Name:           smartalert-web
Version:        17.2.24
Release:        1%{?dist}.fmi
Summary:        SmartMet SmartAlert Website
Group:          System Environment/Base
License:        MIT
URL:            https://github.com/fmidev/smartalert-web
BuildRoot:      %{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:	noarch

Requires:	httpd


%description
TODO

%prep

%build

%pre

%install
rm -rf $RPM_BUILD_ROOT
mkdir $RPM_BUILD_ROOT
cd $RPM_BUILD_ROOT

mkdir -p .%{smartmetroot}/www/smartalert

cp %_topdir/SOURCES/smartalert-web/index.html %{buildroot}%{smartmetroot}/www/smartalert/
cp %_topdir/SOURCES/smartalert-web/*.php %{buildroot}%{smartmetroot}/www/smartalert/
cp %_topdir/SOURCES/smartalert-web/*.js %{buildroot}%{smartmetroot}/www/smartalert/
cp -r %_topdir/SOURCES/smartalert-web/i18n %{buildroot}%{smartmetroot}/www/smartalert/
cp -r %_topdir/SOURCES/smartalert-web/css %{buildroot}%{smartmetroot}/www/smartalert/
cp -r %_topdir/SOURCES/smartalert-web/js %{buildroot}%{smartmetroot}/www/smartalert/
cp -r %_topdir/SOURCES/smartalert-web/img %{buildroot}%{smartmetroot}/www/smartalert/

%post

%clean
rm -rf $RPM_BUILD_ROOT

%files
%defattr(-,smartmet,smartmet,-)
%config(noreplace) %{smartmetroot}/www/smartalert/capmap-config.js
%{smartmetroot}/www/smartalert/*

%changelog
* Fri Feb 24 2017 Mikko Rauhala <mikko.rauhala@fmi.fi> 17.2.24-1.el7.fmi
- Initial build 