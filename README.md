# LCMS (Landelijk Crisis Management Systeem) connector

The LCMS connector, as its name suggests, connects to the Dutch LCMS plot system and extracts the plot data. It can either save each layer as a separate GeoJSON file, or publish it to the information data-hub (based on Apache Kafka).

# Usage

In het config.json, the default settings are specified. Most importantly, the LCMS username (can also be provided on the command line) and the LCMS [server URL](https://oefen-veiligheidsregio.lcms.nl/lcms). On the command line, you need to specify the username and (a subset of) the activity that you wish to extract. Optionally, you can `refresh` it every `n` seconds.

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

  Save the GeoJSON every minute to the folder './data':
  >> lcms_connector -p YOUR_PASSWORD -e "Excercise name" -r 60 -f data

  Send the data every minute to Kafka (using the details in config.json):
  >> lcms_connector -p YOUR_PASSWORD -e "Excercise name" -r 60 -k
```

# Limitations

The GeoJSON output does not (yet) include all features that can be specified in LCMS. Noteably, it exports:
- Symbols (icons). The icon pictures are also saved.
- Lines, polylines
- Polygons and circles/arcs
Furthermore, as the GeoJSON specification does not include style information, this data if omitted from the output. As a result, aspects such as line width, dashes, fill colors, etc. are no longer present.

# References

This adapter is based on the OpenLayers LCMS plugin which can be obtained from [IFV](www.ifv.nl). Although that adapter is more complete, it can only be used inside a browser environment, whereas the current adapter can be run as a service on Windows and Linux, generating a standard GeoJSON output.