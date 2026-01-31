#!/bin/bash

#Function to display the scheduled tasks
list_tasks() {
    echo "Scheduled tasks:"
    crontab -l
    echo
}

#Function to add a new tast
add_task() {
    read -p "Enter the command or script to be executed: " command
    read -p "Enter the schedule (hourly, daily, weekly): " schedule
    read -p "Enter any additional parameters: " parameters

    case $schedule in
    hourly)
    cron_schedule="0 * * * *"
    ;;
    daily)
    cron_schedule="0 0 * * *"
    ;;
    weekly)
    cron_schedule="0 0 * * 0"
    ;;
    *)
    echo "Invalid schedule. Please choose hourly, daily, or weekly."
    return
    ;;
    esac

# Add the tast to the crontab
(
    crontab -l 2> /dev/null
    echo "$cron_schedule $command $parameters"
) | crontab -

echo "Task Scheduled successfully."
echo
}

#Function to remove a task
remove_task() {
    read -p "Enter the command or script to be removed: " command

    # Remove the task from the crontab
    crontab -l | grep -v "$command" | crontab -

    echo "Task removed successfully."
    echo
}

# Main menu loop
while true; do
  echo "Task scheduler"
  echo "1. List scheduled tasks"
  echo "2. Add a task"
  echo "3. Remove a task"
  echo "4. Exit"
  read -p "Enter you choice: " choice
  echo

  case $choice in
  1)
    list_tasks
    ;;
  2)
   add_task
   ;;
  3)
   remove_task
   ;;
  4)
   break
   ;;
  *)
   echo "Invalid choice. Please try again."
   echo
   ;;
 esac 
done
