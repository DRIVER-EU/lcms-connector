# LCMS (Landelijk Crisis Management Systeem) connector

The LCMS connector, as its name suggests, connects to the Dutch LCMS plot system and extracts the plot data. It can either save each layer as a separate GeoJSON file, or publish it to Apache Kafka.

# Usage

In the config.json, the default settings are specified. Most importantly, the LCMS username (can also be provided on the command line) and the LCMS [server URL](https://oefen-veiligheidsregio.lcms.nl/lcms). On the command line, you need to specify the username and (a subset of) the activity that you wish to extract. Optionally, you can `refresh` it every `n` seconds.

A local config file can be used to store secret data in a file that won't be added to the repository. It will overrue the settings in the public config file. This file can be placed in `local/config.json`. Example content is:
```
{
  "lcms": {
    "serverUrl": "https://oefen-veiligheidsregio.lcms.nl/lcms",
    "username": "MYUSER",
    "password": "MYPASSWORD",
    "consumeDisciplines": ["SITUATIEBEELD"]
  }
}
```

```console
LCMS connector

  Connect to the Dutch LCMS (Landelijk Crisis Management System) and save each
  plot layer as a GeoJSON file or publish it to Apache Kafka.

Options

  -?, --help Help                                Display help information.
  -k, --kafka Use Kafka                          Send output to Kafka.
  -r, --refresh Refresh time                     Refresh time in seconds (default 0 = no refresh).
  -e, --exercise Name of the selected exercise   Only load the data from the selected exercise. If omitted, show active
                                                 exercises. Case sensitive.
  -f, --folder Output folder                     For saving the GeoJSON files (default ./data).
  -i, --image Image folder                       For saving the image files (default ./images).
  -u, --username Username                        If given, overrides the name specified in config.json.
  -p, --password Password                        LCMS password for the user (as specified in config.json).

Example

  Start in server mode:
  >> lcms_connector -p YOUR_PASSWORD -e "Excercise name" -s -k
```

# gui

> Simple GUI for the LCMS adapter is available at http://localhost:5000

# Limitations

The GeoJSON output does not (yet) include all features that can be specified in LCMS. Noteably, it exports:
- Symbols (icons). The icon pictures are also saved.
- Lines, polylines
- Polygons and circles/arcs
Furthermore, as the GeoJSON specification does not include style information, this data if omitted from the output. As a result, aspects such as line width, dashes, fill colors, etc. are no longer present.

# DRIVER+ Trial 

In the DRIVER+ Netherlands trial the LCMS-connector is used to display messages from CrisisSuite and other tools that publish information on the test-bed in LCMS. In order to set-up the LCMS-connector for this, the following steps should be followed: 
- Log into LCMS and create a new (or select an existing) scenario in the LCMS oefenomgeving.
- Make sure that there are tabs created for the partners that should be able to send information to LCMS, as the connector can not do that yet.
  - E.g. the HTM table using CrisisSuite will send messages from ```htm@crisissuite.com```. Therefore, add a tab under 'Monodisciplines' called 'HTM' (all capitals!). This new tab will show all messages from HTM, also the ones from e.g. ```htm@sim-ci.com```.
- Start the server by ```node dist\\run.js -p 'MY_PASSWORD' -e 'DRIVER+ Dry Run Training' -k -d -s```
- A simple GUI can be found on (http://localhost:5000)[http://localhost:5000]


# References

This adapter is based on the OpenLayers LCMS plugin which can be obtained from [IFV](www.ifv.nl). Although that adapter is more complete, it can only be used inside a browser environment, whereas the current adapter can be run as a service on Windows and Linux, generating a standard GeoJSON output.
