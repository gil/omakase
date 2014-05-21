root = "/home/{{ ansible_ssh_user }}/apps/webapp-server/current"
working_directory root
pid "#{root}/tmp/pids/unicorn.pid"
stderr_path "#{root}/log/unicorn.log"
stdout_path "#{root}/log/unicorn.log"

listen "/tmp/unicorn.watermelon.sock"
worker_processes 2
timeout 30