import base64

with open("/Users/dulaninw/ece461-phase2/rdme-next.zip", "rb") as zip_file:
    encoded_string = base64.b64encode(zip_file.read()).decode()

with open("/Users/dulaninw/ece461-phase2/zip_test.txt", 'w') as output_file:
    output_file.write(encoded_string)