%define smartmetroot /smartmet

Name:           smartalert-web
Version:        21.4.20
Release:        1%{?dist}.fmi
Summary:        SmartMet SmartAlert Website
Group:          System Environment/Base
License:        MIT
URL:            https://github.com/fmidev/smartalert-web
BuildRoot:      %{_tmppath}/%{name}-%{version}-%{release}-root-%(%{__id_u} -n)
BuildArch:	    noarch

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
cp %_topdir/SOURCES/smartalert-web/cap-logo.png %{buildroot}%{smartmetroot}/www/smartalert/
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
%config(noreplace) %{smartmetroot}/www/smartalert/index.html
%{smartmetroot}/www/smartalert/*

%changelog
* Tue Apr 13 2021 Ville Oravilkka <ville.oravilkka@fmi.fi> 21.4.20-1.el7.fmi
- Add support for UPDATE messages
* Tue Apr 13 2021 Ville Oravilkka <ville.oravilkka@fmi.fi> 21.4.13-1.el7.fmi
- Update translation files
* Thu Feb 4 2021 Ville Oravilkka <ville.oravilkka@fmi.fi> 21.2.4-1.el7.fmi
- Convert application to use Leaflet and other changes
* Fri Nov 10 2017 Mikko Rauhala <mikko.rauhala@fmi.fi> 17.11.10-1.el7.fmi
- Added pictogram for drought
* Thu Nov 9 2017 Mikko Rauhala <mikko.rauhala@fmi.fi> 17.11.9-1.el7.fmi
- Added pictogram for dust
* Wed Nov 8 2017 Mikko Rauhala <mikko.rauhala@fmi.fi> 17.11.8-1.el7.fmi
- Updated pictograms
* Fri Feb 24 2017 Mikko Rauhala <mikko.rauhala@fmi.fi> 17.2.24-1.el7.fmi
- Initial build 
