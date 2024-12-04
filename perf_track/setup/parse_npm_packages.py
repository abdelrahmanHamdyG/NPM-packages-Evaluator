file = open("npmpackages5","r", encoding='utf8')
content = file.read()
lines = content.split('\n')
file_write = open("npm_test_packages_5.txt", "w")
for i in lines:
    if i:
        file_write.write(i.split()[0] + '\n')

file.close()
file_write.close()